export class IpcClient {
  private port: number | null = null;

  setPort(port: number) {
    this.port = port;
  }

  getPort(): number | null {
    return this.port;
  }

  async request<T = unknown>(route: string, body?: unknown): Promise<T> {
    if (!this.port) {
      throw new Error("IPC port not configured. Is the MCP server running?");
    }

    const res = await fetch(`http://127.0.0.1:${this.port}${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`IPC error ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async getStatus(): Promise<{ loggedIn: boolean; port: number }> {
    return this.request("/status");
  }

  async getMessages(folder?: string, count?: number) {
    return this.request("/messages", { folder, count });
  }

  async getMessage(id: string) {
    return this.request("/message", { id });
  }

  async deleteMessage(id: string) {
    return this.request("/delete", { id });
  }

  async moveMessage(id: string, folder: string) {
    return this.request("/move", { id, folder });
  }

  async getFolders() {
    return this.request("/folders");
  }

  async getUnsubscribeInfo(id: string) {
    return this.request("/unsubscribe-info", { id });
  }

  async unsubscribe(id: string) {
    return this.request("/unsubscribe", { id });
  }
}
