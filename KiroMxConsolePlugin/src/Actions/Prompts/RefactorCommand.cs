namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class RefactorCommand : AnimatedPromptCommand
    {
        public RefactorCommand() : base("Refactor", "Refactor the code, apply SOLID principles.", tileIndex: 1) { }

        protected override String Prompt => "refactor this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Refactor";
    }
}
