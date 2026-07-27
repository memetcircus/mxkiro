namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class DocumentCommand : AnimatedPromptCommand
    {
        public DocumentCommand() : base("Document", "Add documentation to code.", tileIndex: 7) { }

        protected override String Prompt => "document this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Document";
    }
}
