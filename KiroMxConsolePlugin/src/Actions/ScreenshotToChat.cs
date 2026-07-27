namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Takes an interactive screenshot and pastes it into the active Kiro chat input.
    /// Does NOT send the message — user adds their prompt text and presses Enter.
    /// </summary>
    public class ScreenshotToChat : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public ScreenshotToChat()
            : base("Screenshot", "Capture screen area and paste into Kiro chat", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/screenshot");
            PluginLog.Info("📸 Screenshot to chat requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Screen\nCapture";
    }
}
