using IgniteView.Core;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;

namespace Aonsoku.AudioPlayer
{
    public class PlayerThread
    {
        public static ConcurrentQueue<Action> ActionQueue = new ConcurrentQueue<Action>();
        public static Thread Running;
        public static Stopwatch Timer = new Stopwatch();

        // Millisecond values
        const long QueueInterval = 5;
        const long TimeUpdateInterval = 500;
        static long TimeSinceLastTimeUpdate = TimeUpdateInterval;

        public static async Task PlayerThreadLoop()
        {
            while (true)
            {
                try
                {
                    Timer.Restart();

                    if (TimeSinceLastTimeUpdate > TimeUpdateInterval)
                    {
                        UpdateTimeForAllPlayers();
                        TimeSinceLastTimeUpdate = 0;
                    }

                    while (ActionQueue.TryDequeue(out var action))
                    {
                        action.Invoke();
                    }

                    while (Timer.ElapsedMilliseconds < QueueInterval)
                    {
                        Thread.Yield();
                    }

                    Timer.Stop();
                    TimeSinceLastTimeUpdate += Timer.ElapsedMilliseconds;
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
