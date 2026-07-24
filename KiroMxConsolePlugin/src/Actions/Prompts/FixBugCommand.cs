namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class FixBugCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public FixBugCommand()
            : base("Fix Bug", "Find and fix the bug.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Find and fix the bug in this code. Explain the root cause first, then apply a minimal fix.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Fix Bug";
    }
}
