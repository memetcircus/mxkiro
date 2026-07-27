namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Opens a new Kiro chat session and resets the health counter.
    /// Bridge handles both the counter reset and opening new session in IDE.
    /// </summary>
    public class NewSessionCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public NewSessionCommand()
            : base("New Session", "Start a new Kiro chat session", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/session/new");
            PluginLog.Info("🆕 New session requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "New\nSession";
    }
}
