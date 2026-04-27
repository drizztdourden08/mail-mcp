export interface DeviceCodeChallenge {
  code: string;
  uri: string;
  source?: string;
  expiresIn?: number;
}
