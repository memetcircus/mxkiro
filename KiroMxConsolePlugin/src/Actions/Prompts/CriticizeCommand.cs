namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class CriticizeCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public CriticizeCommand()
            : base("Criticize", "Be honest, criticize. Suggest better alternatives.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Be honest and critical. Tell me what's wrong with this code. If you have a better idea, suggest an alternative.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Criticize";
    }
}
