namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    public class FixBugCommand : AnimatedPromptCommand
    {
        public FixBugCommand() : base("Fix Bug", "Find and fix the bug.", tileIndex: 4) { }

        protected override String Prompt => "find and fix the bug";

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) => "Fix Bug";
    }
}
