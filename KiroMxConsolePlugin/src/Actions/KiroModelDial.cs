namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Threading;

    /// <summary>
    /// Roller/dial adjustment for switching AI models.
    /// Uses debounce: accumulates ticks, then moves by net steps after settling.
    /// </summary>
    public class KiroModelDial : PluginDynamicAdjustment
    {
        private readonly BridgeClient _bridge;
        private Int32 _modelIndex = 0;
        private Timer _debounceTimer;
        private Int32 _accumulatedDiff;
        private readonly Object _lock = new Object();

        private const Int32 DebounceDelayMs = 250;

        private static readonly String[] Models = new[]
        {
            "Auto",
            "Opus",
            "Sonnet",
            "Haiku",
            "DeepSeek"
        };

        public KiroModelDial()
            : base("Model Select", "Switch AI model", "Kiro Controls", hasReset: false)
        {
            this._bridge = new BridgeClient();
        }

        protected override void ApplyAdjustment(String actionParameter, Int32 diff)
        {
            lock (this._lock)
            {
                this._accumulatedDiff += diff;

                // Preview the model name on dial display immediately
                var previewIndex = this._modelIndex + this._accumulatedDiff;
                previewIndex = ((previewIndex % Models.Length) + Models.Length) % Models.Length;

                this._debounceTimer?.Dispose();
                this._debounceTimer = new Timer(this.OnDebounceElapsed, null, DebounceDelayMs, Timeout.Infinite);
            }

            this.AdjustmentValueChanged();
        }

        private void OnDebounceElapsed(Object state)
        {
            Int32 totalDiff;

            lock (this._lock)
            {
                totalDiff = this._accumulatedDiff;
                this._accumulatedDiff = 0;
                this._debounceTimer?.Dispose();
                this._debounceTimer = null;
            }

            if (totalDiff == 0)
            {
                return;
            }

            // Apply net steps with wrapping
            this._modelIndex += totalDiff;
            this._modelIndex = ((this._modelIndex % Models.Length) + Models.Length) % Models.Length;

            var direction = totalDiff > 0 ? 1 : -1;
            _ = this._bridge.SendModelSwitchAsync(direction);
            this.AdjustmentValueChanged();
            PluginLog.Info($"Model switched to: {Models[this._modelIndex]}");
        }

        protected override void RunCommand(String actionParameter)
        {
            // No reset for model dial
        }

        protected override String GetAdjustmentValue(String actionParameter)
        {
            lock (this._lock)
            {
                // Show preview during accumulation
                var previewIndex = this._modelIndex + this._accumulatedDiff;
                previewIndex = ((previewIndex % Models.Length) + Models.Length) % Models.Length;
                return Models[previewIndex];
            }
        }
    }
}
