namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Records screen for up to 20 seconds, extracts frames, and sends to Kiro chat.
    /// First press starts recording, second press stops early.
    /// </summary>
    public class ScreenRecordCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public ScreenRecordCommand()
            : base("Screen Record", "Record screen and send frames to Kiro", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/screen-record");
            PluginLog.Info("🎬 Screen record requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Screen\nRecord";
    }
}
