namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;
    using System.Threading.Tasks;

    /// <summary>
    /// Communicates with the MX Kiro Bridge Service via HTTP.
    /// Bridge handles Kiro ACP connection and state management.
    /// </summary>
    public class BridgeClient
    {
        private static readonly HttpClient Http = new HttpClient();
        private const String BridgeBaseUrl = "http://localhost:9848";

        private String _currentState = "idle";

        public String CurrentState => this._currentState;

        public event Action<String> StateChanged;

        /// <summary>
        /// Sends a prompt/skill to Kiro via Bridge.
        /// </summary>
        public async Task SendPromptAsync(String prompt)
        {
            try
            {
                var url = $"{BridgeBaseUrl}/prompt?text={Uri.EscapeDataString(prompt)}";
                await Http.GetAsync(url);
                this._currentState = "working";
                this.StateChanged?.Invoke(this._currentState);
                PluginLog.Info($"Sent prompt: {prompt}");
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Bridge not available: {ex.Message}");
            }
        }

        /// <summary>
        /// Sends a cancel command to stop Kiro.
        /// </summary>
        public async Task SendCancelAsync()
        {
            try
            {
                await Http.GetAsync($"{BridgeBaseUrl}/state/idle");
                this._currentState = "idle";
                this.StateChanged?.Invoke(this._currentState);
                PluginLog.Info("Sent cancel");
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Bridge not available: {ex.Message}");
            }
        }

        /// <summary>
        /// Sends a session navigation command.
        /// </summary>
        public async Task SendSessionNavigateAsync(Int32 ticks)
        {
            try
            {
                await Http.GetAsync($"{BridgeBaseUrl}/session/navigate?ticks={ticks}");
                PluginLog.Info($"Session navigate: {ticks}");
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Bridge not available: {ex.Message}");
            }
        }

        /// <summary>
        /// Sends a model switch command.
        /// </summary>
        public async Task SendModelSwitchAsync(Int32 ticks)
        {
            try
            {
                await Http.GetAsync($"{BridgeBaseUrl}/model/switch?ticks={ticks}");
                PluginLog.Info($"Model switch: {ticks}");
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Bridge not available: {ex.Message}");
            }
        }

        /// <summary>
        /// Polls the bridge for current state.
        /// </summary>
        public async Task<String> GetStateAsync()
        {
            try
            {
                var response = await Http.GetStringAsync($"{BridgeBaseUrl}/health");
                return response;
            }
            catch
            {
                return "offline";
            }
        }
    }
}
