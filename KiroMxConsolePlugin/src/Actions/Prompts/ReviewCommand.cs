namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class ReviewCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public ReviewCommand()
            : base("Review", "Comprehensive code review.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Review this code comprehensively. Check for bug potential, code quality, performance, and security issues.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Review";
    }
}
