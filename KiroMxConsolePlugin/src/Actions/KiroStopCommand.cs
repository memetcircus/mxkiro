namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    public class KiroStopCommand : AnimatedCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public KiroStopCommand()
            : base("Stop Kiro", "Cancel current Kiro operation", "Kiro Controls", tileIndex: 5) { }

        protected override async void RunCommand(String actionParameter)
        {
            try
            {
                using var response = await Http.GetAsync("http://localhost:9848/cancel");
                PluginLog.Info("🛑 Cancel sent to bridge");
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Failed to cancel: {ex.Message}");
            }
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Stop";
    }
}
