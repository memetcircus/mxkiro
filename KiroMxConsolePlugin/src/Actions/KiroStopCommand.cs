namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Stops/cancels the current Kiro operation through the Bridge.
    /// </summary>
    public class KiroStopCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public KiroStopCommand()
            : base("Stop Kiro", "Cancel current Kiro operation", "Kiro Controls") { }

        protected override async void RunCommand(String actionParameter)
        {
            try
            {
                using var response = await Http.GetAsync("http://localhost:9848/cancel");
                response.EnsureSuccessStatusCode();
                PluginLog.Info("🛑 Cancel sent to bridge");
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"Failed to cancel Kiro: {ex.Message}");
            }
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Stop";
    }
}
