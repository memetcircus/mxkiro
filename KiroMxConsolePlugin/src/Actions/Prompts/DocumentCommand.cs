namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class DocumentCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge = new BridgeClient();

        public DocumentCommand()
            : base("Document", "Add documentation to code.", "Kiro Prompts") { }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendPromptAsync("Document this code. Add JSDoc/TSDoc comments, explain each public function with parameters and return values.");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Document";
    }
}
