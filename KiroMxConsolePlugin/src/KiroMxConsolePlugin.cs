namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;
    using System.Text.Json;
    using System.Threading;

    public class KiroMxConsolePlugin : Plugin
    {
        private static readonly HttpClient Http = new HttpClient();
        private Timer _statePoller;
        private String _currentHealthLevel = "normal";

        public override Boolean UsesApplicationApiOnly => true;
        public override Boolean HasNoApplication => true;

        /// <summary>
        /// Current session health level (normal, thinking, worried, critical).
        /// Accessible by commands to adjust their display.
        /// </summary>
        public static String HealthLevel { get; private set; } = "normal";
        public static Int32 MessageCount { get; private set; } = 0;

        public KiroMxConsolePlugin()
        {
            PluginLog.Init(this.Log);
            PluginResources.Init(this.Assembly);
        }

        public override void Load()
        {
            // Poll bridge state every 500ms to sync animation quickly
            this._statePoller = new Timer(this.PollBridgeState, null, 1000, 500);
        }

        public override void Unload()
        {
            this._statePoller?.Dispose();
            GhostAnimationManager.Instance.Stop();
        }

        private async void PollBridgeState(Object state)
        {
            try
            {
                var response = await Http.GetStringAsync("http://localhost:9848/health");

                // Parse health data
                try
                {
                    using var doc = JsonDocument.Parse(response);
                    var root = doc.RootElement;

                    if (root.TryGetProperty("healthLevel", out var hl))
                    {
                        HealthLevel = hl.GetString() ?? "normal";
                    }
                    if (root.TryGetProperty("messageCount", out var mc))
                    {
                        MessageCount = mc.GetInt32();
                    }

                    if (root.TryGetProperty("state", out var st))
                    {
                        var stateStr = st.GetString() ?? "idle";

                        if (stateStr == "working")
                        {
                            if (!GhostAnimationManager.Instance.IsRunning)
                            {
                                GhostAnimationManager.Instance.Start();
                            }
                        }
                        else
                        {
                            if (GhostAnimationManager.Instance.IsRunning)
                            {
                                GhostAnimationManager.Instance.Stop();
                            }
                        }
                    }
                }
                catch
                {
                    // JSON parse failed — try simple string check
                    if (response.Contains("working"))
                    {
                        if (!GhostAnimationManager.Instance.IsRunning)
                            GhostAnimationManager.Instance.Start();
                    }
                    else
                    {
                        if (GhostAnimationManager.Instance.IsRunning)
                            GhostAnimationManager.Instance.Stop();
                    }
                }
            }
            catch
            {
                // Bridge offline — ignore
            }
        }
    }
}
