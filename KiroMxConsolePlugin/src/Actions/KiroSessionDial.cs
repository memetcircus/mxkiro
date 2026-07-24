namespace Loupedeck.KiroMxConsolePlugin
{
    using System;

    /// <summary>
    /// Dial adjustment for navigating between Kiro sessions.
    /// Clockwise = next session, Counter-clockwise = previous session.
    /// </summary>
    public class KiroSessionDial : PluginDynamicAdjustment
    {
        private readonly BridgeClient _bridge;
        private Int32 _sessionIndex = 0;

        public KiroSessionDial()
            : base("Session Navigate", "Navigate between Kiro sessions", "Kiro Controls", hasReset: true)
        {
            this._bridge = new BridgeClient();
        }

        protected override void ApplyAdjustment(String actionParameter, Int32 diff)
        {
            this._sessionIndex += diff;
            if (this._sessionIndex < 0) this._sessionIndex = 0;
            _ = this._bridge.SendSessionNavigateAsync(diff);
            this.AdjustmentValueChanged();
        }

        protected override void RunCommand(String actionParameter)
        {
            // Reset / confirm active session
            PluginLog.Info($"Session confirmed at index {this._sessionIndex}");
            this.AdjustmentValueChanged();
        }

        protected override String GetAdjustmentValue(String actionParameter) =>
            $"Session {this._sessionIndex}";
    }
}
