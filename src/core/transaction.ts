import { Signer } from '@ethersproject/abstract-signer';
import { Wallet } from '@ethersproject/wallet';
import { SignedTx } from '@vocdoni/proto/vochain';
import { Buffer } from 'buffer';
import { strip0x } from '../util/common';
import { Signing } from '../util/signing';

export abstract class TransactionCore {
  /**
   * Cannot be constructed.
   */
  protected constructor() {}

  public static async signTransaction(
    tx: Uint8Array,
    chainId: string,
    walletOrSigner: Wallet | Signer
  ): Promise<string> {
    return Signing.signTransaction(tx, chainId, walletOrSigner).then((hexSignature) => {
      const signature = new Uint8Array(Buffer.from(strip0x(hexSignature), 'hex'));
      const signedTx = SignedTx.encode({ tx, signature }).finish();
      return Buffer.from(signedTx).toString('base64');
    });
  }
}
