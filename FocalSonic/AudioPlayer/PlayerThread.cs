using IgniteView.Core;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.AudioPlayer
{
    public class PlayerThread
    {
        public static ConcurrentQueue<Action> ActionQueue = new ConcurrentQueue<Action>();
        public static Thread Running;

        // Millisecond values
        const long QueueInterval = 25;
        const long TimeUpdateInterval = 500;
        static long TimeSinceLastTimeUpdate = TimeUpdateInterval;

        public static async Task PlayerThreadLoop()
        {
            while (true)
            {
                try
                {
                    if (TimeSinceLastTimeUpdate > (Performance.IsRunningInForeground ? 200 : 750))
                    {
                        UpdateTimeForAllPlayers();
                        TimeSinceLastTimeUpdate = 0;
                    }

                    while (ActionQueue.TryDequeue(out var action))
                    {
                        // Per-action, so one failure doesn't abandon the rest of the tick.
                        try { action.Invoke(); }
                        catch (Exception actionEx) { Console.Error.WriteLine("Player action failed: " + actionEx); }
                    }

                    await Task.Delay((int)QueueInterval);

                    TimeSinceLastTimeUpdate += QueueInterval;
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.ToString());
                }
            }
        }

        public static async Task UpdateTimeForAllPlayers()
        {
            foreach (var player in AudioPlayer.ActivePlayers.Values)
            {
                await player.SendTimeUpdate(true);
            }
        }

        public static void Start()
        {
            Running = new Thread(() => PlayerThreadLoop())
            {
                IsBackground = false
            };

            Running.Start();
        }
    }
}
