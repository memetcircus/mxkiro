namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Threading;

    /// <summary>
    /// Dial adjustment for navigating between Kiro session tabs.
    /// Accumulates notches locally and fires navigation only after threshold is reached.
    /// This avoids over-sensitivity — user needs a deliberate rotation to switch sessions.
    /// </summary>
    public class KiroSessionDial : PluginDynamicAdjustment
    {
        private readonly BridgeClient _bridge;
        private Int32 _accumulator = 0;
        private Timer _resetTimer;
        private readonly Object _lock = new Object();

        // Require this many notches in same direction to fire. 30 ≈ a full deliberate turn.
        private const Int32 Threshold = 30;
        // Reset accumulator if no tick received within this window.
        private const Int32 ResetMs = 3000;

        public KiroSessionDial()
            : base("Session Navigate", "Navigate between Kiro session tabs", "Kiro Controls", hasReset: false)
        {
            this._bridge = new BridgeClient();
        }

        protected override void ApplyAdjustment(String actionParameter, Int32 diff)
        {
            lock (this._lock)
            {
                // If direction changed, reset
                if ((this._accumulator > 0 && diff < 0) || (this._accumulator < 0 && diff > 0))
                {
                    this._accumulator = 0;
                }

                this._accumulator += diff;

                // Reset timer on each notch
                this._resetTimer?.Dispose();
                this._resetTimer = new Timer((_) =>
                {
                    lock (this._lock)
                    {
                        this._accumulator = 0;
                    }
                    this.AdjustmentValueChanged();
                }, null, ResetMs, Timeout.Infinite);

                // Fire when threshold reached
                if (Math.Abs(this._accumulator) >= Threshold)
                {
                    var ticks = this._accumulator > 0 ? 1 : -1;
                    this._accumulator = 0;
                    _ = this._bridge.SendSessionNavigateAsync(ticks);
                    PluginLog.Info($"Session navigate fired: {ticks}");
                }
            }

            this.AdjustmentValueChanged();
        }

        protected override void RunCommand(String actionParameter)
        {
            // Dial press — reset accumulator
            lock (this._lock)
            {
                this._accumulator = 0;
            }
            PluginLog.Info("Session dial pressed — reset");
        }

        protected override String GetAdjustmentValue(String actionParameter)
        {
            var acc = this._accumulator;
            return Math.Abs(acc) > 0 ? $"({acc}/{Threshold})" : "Sessions";
        }
    }
}
