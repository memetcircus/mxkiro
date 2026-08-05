namespace Loupedeck.KiroMxConsolePlugin
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Threading;

    /// <summary>
    /// Manages ghost walk animation across 9 LCD buttons.
    /// Loads tile sprites from disk and cycles frames via timer.
    /// </summary>
    public class GhostAnimationManager
    {
        private const Int32 FrameCount = 30;
        private const Int32 TileCount = 9;

        // Animation speed — constant across all health levels
        private const Int32 AnimationSpeed = 100; // ~10 fps

        private static GhostAnimationManager _instance;
        private static readonly Object Lock = new Object();

        private Timer _timer;
        private Int32 _currentFrame;
        private Boolean _isRunning;

        // Cached sprite data: [frame * TileCount + tile] = byte[]
        private Byte[][] _frameData;           // normal ghost
        private Byte[][] _frameDataWorried;    // worried ghost (60-75%)
        private Byte[][] _frameDataFire;       // critical/fire ghost (75%+)
        private Boolean _spritesLoaded;
        private Boolean _worriedLoaded;
        private Boolean _fireLoaded;

        // Subscribers that need to redraw when frame changes
        private readonly List<Action> _subscribers = new List<Action>();

        public static GhostAnimationManager Instance
        {
            get
            {
                if (_instance == null)
                {
                    lock (Lock)
                    {
                        _instance ??= new GhostAnimationManager();
                    }
                }
                return _instance;
            }
        }

        public Int32 CurrentFrame => this._currentFrame;
        public Boolean IsRunning => this._isRunning;

        private GhostAnimationManager()
        {
            try
            {
                var normalPath = this.FindSpritesPath("ghost-walk");
                if (!String.IsNullOrEmpty(normalPath))
                {
                    this._frameData = this.LoadSpriteSet(normalPath);
                    this._spritesLoaded = this._frameData != null;
                }
                else
                {
                    PluginLog.Warning("👻 Normal sprites not found — animation disabled");
                }

                var worriedPath = this.FindSpritesPath("ghost-walk-worried");
                if (!String.IsNullOrEmpty(worriedPath))
                {
                    this._frameDataWorried = this.LoadSpriteSet(worriedPath);
                    this._worriedLoaded = this._frameDataWorried != null;
                }

                var firePath = this.FindSpritesPath("ghost-walk-fire");
                if (!String.IsNullOrEmpty(firePath))
                {
                    this._frameDataFire = this.LoadSpriteSet(firePath);
                    this._fireLoaded = this._frameDataFire != null;
                }
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"👻 Animation init failed: {ex.Message}");
                this._spritesLoaded = false;
            }
        }

        /// <summary>
        /// Subscribe a button command to get notified on frame changes.
        /// </summary>
        public void Subscribe(Action onFrameChanged)
        {
            lock (this._subscribers)
            {
                this._subscribers.Add(onFrameChanged);
            }
        }

        /// <summary>
        /// Unsubscribe a button command.
        /// </summary>
        public void Unsubscribe(Action onFrameChanged)
        {
            lock (this._subscribers)
            {
                this._subscribers.Remove(onFrameChanged);
            }
        }

        /// <summary>
        /// Start the ghost walk animation.
        /// </summary>
        public void Start()
        {
            if (this._isRunning) return;
            if (!this._spritesLoaded) return;

            this._isRunning = true;
            this._currentFrame = 0;
            this._timer = new Timer(this.OnTick, null, 0, AnimationSpeed);
            PluginLog.Info("👻 Ghost animation started");
        }

        /// <summary>
        /// Stop the animation and reset to idle state.
        /// </summary>
        public void Stop()
        {
            if (!this._isRunning) return;

            this._isRunning = false;
            this._timer?.Dispose();
            this._timer = null;
            this._currentFrame = 0;

            // Notify twice with a small delay to ensure Logi SDK clears the cached image
            this.NotifySubscribers();

            var resetTimer = new Timer((_) =>
            {
                this.NotifySubscribers();
            }, null, 200, Timeout.Infinite);

            PluginLog.Info("👻 Ghost animation stopped");
        }

        /// <summary>
        /// Get the sprite data for a specific tile at the current frame.
        /// Selects sprite set based on current health level.
        /// Sprite set transitions only happen at frame 0 to avoid mid-animation jumps.
        /// </summary>
        private String _activeHealthLevel = "normal";

        public Byte[] GetTileData(Int32 tileIndex)
        {
            if (!this._spritesLoaded || !this._isRunning) return null;
            if (tileIndex < 0 || tileIndex >= TileCount) return null;

            // Only switch sprite set at frame 0 (start of animation cycle)
            if (this._currentFrame == 0)
            {
                this._activeHealthLevel = KiroMxConsolePlugin.HealthLevel;
            }

            var dataIndex = this._currentFrame * TileCount + tileIndex;

            // Select sprite set based on locked health level
            Byte[][] activeSet = this._activeHealthLevel switch
            {
                "critical" when this._fireLoaded => this._frameDataFire,
                "worried" when this._worriedLoaded => this._frameDataWorried,
                _ => this._frameData,
            };

            if (dataIndex >= activeSet.Length) return null;
            return activeSet[dataIndex];
        }

        private void OnTick(Object state)
        {
            this._currentFrame = (this._currentFrame + 1) % FrameCount;
            this.NotifySubscribers();
        }

        private void NotifySubscribers()
        {
            List<Action> subs;
            lock (this._subscribers)
            {
                subs = new List<Action>(this._subscribers);
            }

            foreach (var sub in subs)
            {
                try { sub(); }
                catch { /* Ignore subscriber errors */ }
            }
        }

        private Byte[][] LoadSpriteSet(String spritesPath)
        {
            try
            {
                var data = new Byte[FrameCount * TileCount][];

                for (var frame = 0; frame < FrameCount; frame++)
                {
                    for (var tile = 0; tile < TileCount; tile++)
                    {
                        var fileName = $"frame-{frame:D2}-tile-{tile}.png";
                        var filePath = Path.Combine(spritesPath, fileName);

                        if (File.Exists(filePath))
                        {
                            data[frame * TileCount + tile] = File.ReadAllBytes(filePath);
                        }
                    }
                }

                PluginLog.Info($"👻 Loaded {FrameCount * TileCount} tiles from {spritesPath}");
                return data;
            }
            catch (Exception ex)
            {
                PluginLog.Warning($"👻 Failed to load sprites from {spritesPath}: {ex.Message}");
                return null;
            }
        }

        private String FindSpritesPath(String subdir)
        {
            var candidates = new List<String>();

            try
            {
                var assemblyLocation = this.GetType().Assembly.Location;
                if (!String.IsNullOrEmpty(assemblyLocation))
                {
                    var assemblyDir = Path.GetDirectoryName(assemblyLocation);
                    if (!String.IsNullOrEmpty(assemblyDir))
                    {
                        candidates.Add(Path.Combine(assemblyDir, "..", "sprites", "tiles", subdir));
                        candidates.Add(Path.Combine(assemblyDir, "sprites", "tiles", subdir));
                    }
                }
            }
            catch
            {
                // Assembly location not available
            }

            var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            if (!String.IsNullOrEmpty(home))
            {
                candidates.Add(Path.Combine(home, "Projects", "mxkiro", "assets", "sprites", "tiles", subdir));
                candidates.Add(Path.Combine(home, ".kiro-mx", "sprites", subdir));
            }

            foreach (var path in candidates)
            {
                try
                {
                    if (Directory.Exists(path))
                    {
                        PluginLog.Info($"👻 Found sprites at: {path}");
                        return path;
                    }
                }
                catch
                {
                    // Skip invalid paths
                }
            }

            return null;
        }
    }
}
