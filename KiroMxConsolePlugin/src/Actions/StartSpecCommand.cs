namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Net.Http;

    /// <summary>
    /// Starts a spec workflow — asks Kiro to create requirements, design, and tasks
    /// without executing until the user reviews.
    /// </summary>
    public class StartSpecCommand : PluginDynamicCommand
    {
        private static readonly HttpClient Http = new HttpClient();

        public StartSpecCommand()
            : base("Start Spec", "Begin a spec workflow with requirements, design, tasks", "Kiro Controls") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = Http.GetAsync("http://localhost:9848/prompt?text=" +
                Uri.EscapeDataString("Turn this into a structured spec. Create requirements first, then a technical design, then break it into tasks. Do not execute anything until I review and approve the plan."));
            PluginLog.Info("📋 Start Spec requested");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "Start\nSpec";
    }
}
