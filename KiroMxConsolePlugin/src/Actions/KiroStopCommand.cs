namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Stops/cancels the current Kiro operation.
    /// </summary>
    public class KiroStopCommand : PluginDynamicCommand
    {
        private readonly BridgeClient _bridge;

        public KiroStopCommand()
            : base("Stop Kiro", "Cancel current Kiro operation", "Kiro Controls")
        {
            this._bridge = new BridgeClient();
        }

        protected override void RunCommand(String actionParameter)
        {
            _ = this._bridge.SendCancelAsync();
            PluginLog.Info("Kiro stop sent");
        }

        protected override String GetCommandDisplayName(String actionParameter, PluginImageSize imageSize) =>
            "⏹️\nStop";
    }
}
