namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class CriticizeCommand : AnimatedPromptCommand
    {
        public CriticizeCommand() : base("Criticize", "Be honest, criticize. Suggest better alternatives.", tileIndex: 0) { }

        protected override String Prompt => "criticize this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Criticize";
    }
}
