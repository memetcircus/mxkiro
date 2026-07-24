namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class ExplainCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public ExplainCommand()
            : base("Explain", "Explain the code step by step.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Explain this code to me. What it does, why it's written this way, step by step.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Explain";
    }
}
