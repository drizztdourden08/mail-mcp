import type { ProviderInfo } from "../types/provider.js";

export class ProviderRegistry {
  private providers: ProviderInfo[] = [];

  register(info: ProviderInfo): void {
    this.providers.push(info);
  }

  getAll(): ProviderInfo[] {
    return this.providers;
  }
}
