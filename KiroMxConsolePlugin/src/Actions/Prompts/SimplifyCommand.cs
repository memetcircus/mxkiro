namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class SimplifyCommand : AnimatedPromptCommand
    {
        public SimplifyCommand() : base("Simplify", "Simplify code, remove over-engineering.", tileIndex: 8) { }

        protected override String Prompt => "simplify this code";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Simplify";
    }
}
