// @ts-ignore
import { clientParams } from './util/client.params';
import { Election, PlainCensus, WeightedCensus, VocdoniSDKClient, Vote } from '../../src';
import { Wallet } from '@ethersproject/wallet';
// @ts-ignore
import { waitForElectionReady } from './util/client.utils';
import { AnonymousVote } from '../../src';

let client: VocdoniSDKClient;
let wallet: Wallet;

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(async () => {
  wallet = Wallet.createRandom();
  client = new VocdoniSDKClient(clientParams(wallet));
});

const createElection = (census, electionType?, voteType?, maxCensusSize?) => {
  const election = Election.from({
    title: 'SDK Testing - Title',
    description: 'SDK Testing - Description',
    endDate: new Date().getTime() + 10000000,
    census,
    maxCensusSize,
    electionType: electionType ?? null,
    voteType: voteType ?? null,
  });

  election.addQuestion('This is a title', 'This is a description', [
    {
      title: 'Option 1',
      value: 0,
    },
    {
      title: 'Option 2',
      value: 1,
    },
  ]);

  return election;
};

describe('zkSNARK test', () => {
  it('should create an anonymous election and vote successfully', async () => {
    const census = new PlainCensus();
    const voter1 = Wallet.createRandom();
    const voter2 = Wallet.createRandom();
    // User that votes with account with SIK
    census.add((client.wallet as Wallet).address);
    // User that votes and has no account
    census.add(voter1.address);
    // User that votes with account without SIK
    census.add(voter2.address);

    const election = createElection(census, {
      anonymous: true,
    });

    await client.createAccount({
      sik: true,
      password: 'password123',
    });

    await client
      .createElection(election)
      .then((electionId) => {
        expect(electionId).toMatch(/^[0-9a-fA-F]{64}$/);
        client.setElectionId(electionId);
        return client.fetchElection();
      })
      .then((publishedElection) => {
        expect(publishedElection.electionType.anonymous).toBeTruthy();
        return waitForElectionReady(client, publishedElection.id);
      })
      .then(async () => {
        await expect(async () => {
          await client.submitVote(new Vote([0]));
        }).rejects.toThrow();
        const vote = new AnonymousVote([0], 'password123');
        return client.submitVote(vote);
      })
      .then(() => {
        client.wallet = voter1;
        const vote = new AnonymousVote([0], 'password456');
        return client.submitVote(vote);
      })
      .then(() => {
        client.wallet = voter2;
        return client.createAccount({ sik: false });
      })
      .then(() => {
        const vote = new Vote([1]);
        return client.submitVote(vote);
      })
      .then(() => client.fetchElection())
      .then((election) => {
        expect(election.electionType.anonymous).toBeTruthy();
        expect(election.voteCount).toEqual(3);
        expect(election.results[0][0]).toEqual('2');
        expect(election.results[0][1]).toEqual('1');
        expect(election.census.size).toEqual(3);
        expect(election.census.weight).toEqual(BigInt(3));
      });
  }, 285000);
  it('should create a weighted anonymous election and vote successfully', async () => {
    const census = new WeightedCensus();
    const voter1 = Wallet.createRandom();
    const voter2 = Wallet.createRandom();
    // User that votes with account with SIK
    census.add({
      key: (client.wallet as Wallet).address,
      weight: 12n,
    });
    // User that votes and has no account
    census.add({
      key: voter1.address,
      weight: 120n,
    });
    // User that votes with account without SIK
    census.add({
      key: voter2.address,
      weight: 1200n,
    });

    const election = createElection(census, {
      anonymous: true,
    });

    await client.createAccount({
      sik: true,
      password: 'password123',
    });

    await client
      .createElection(election)
      .then((electionId) => {
        expect(electionId).toMatch(/^[0-9a-fA-F]{64}$/);
        client.setElectionId(electionId);
        return client.fetchElection();
      })
      .then((publishedElection) => {
        expect(publishedElection.electionType.anonymous).toBeTruthy();
        return waitForElectionReady(client, publishedElection.id);
      })
      .then(async () => {
        await expect(async () => {
          await client.submitVote(new Vote([0]));
        }).rejects.toThrow();
        const vote = new AnonymousVote([0], 'password123');
        return client.submitVote(vote);
      })
      .then(() => {
        client.wallet = voter1;
        const vote = new AnonymousVote([0], 'password456');
        return client.submitVote(vote);
      })
      .then(() => {
        client.wallet = voter2;
        return client.createAccount({ sik: false });
      })
      .then(() => {
        const vote = new Vote([1]);
        return client.submitVote(vote);
      })
      .then(() => client.fetchElection())
      .then((election) => {
        expect(election.electionType.anonymous).toBeTruthy();
        expect(election.voteCount).toEqual(3);
        expect(election.results[0][0]).toEqual('132');
        expect(election.results[0][1]).toEqual('1200');
        expect(election.census.size).toEqual(3);
        expect(election.census.weight).toEqual(BigInt(12n + 120n + 1200n));
      });
  }, 285000);
  it('should create an anonymous election with 12 participants and each of them should vote correctly', async () => {
    const numVotes = 12; // should be even number
    const census = new PlainCensus();

    const participants: Wallet[] = [...new Array(numVotes)].map(() => Wallet.createRandom());
    census.add(participants.map((participant) => participant.address));

    const election = createElection(census, {
      anonymous: true,
    });

    await client.createAccount();

    await client
      .createElection(election)
      .then((electionId) => {
        expect(electionId).toMatch(/^[0-9a-fA-F]{64}$/);
        client.setElectionId(electionId);
        return waitForElectionReady(client, electionId);
      })
      .then(async () => {
        for (let i = 0; i < participants.length; i++) {
          client.wallet = participants[i];
          let vote: Vote | AnonymousVote = new Vote([i % 2]);

          if (i % 3 == 0) {
            await client.createAccount({
              sik: true,
              password: participants[i].address,
            });
            await expect(async () => {
              await client.submitVote(new AnonymousVote([i % 2], 'wrongpassword'));
            }).rejects.toThrow();
            vote = new AnonymousVote([i % 2], participants[i].address);
          } else if (i % 3 == 1) {
            await client.createAccount({ sik: false });
          }
          const isInCensus = await client.isInCensus();
          expect(isInCensus).toBeTruthy();
          await expect(async () => {
            await client.hasAlreadyVoted();
          }).rejects.toThrow();
          await expect(async () => {
            await client.isAbleToVote();
          }).rejects.toThrow();
          await client.submitVote(vote);
        }
      })
      .then(() => client.fetchElection())
      .then((election) => {
        expect(election.electionType.anonymous).toBeTruthy();
        expect(election.voteCount).toEqual(numVotes);
      });
  }, 720000);
});
