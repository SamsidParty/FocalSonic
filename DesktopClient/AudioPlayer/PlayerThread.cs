using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
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

        // Millisecond values
        const int QueueInterval = 5;
        const int TimeUpdateInterval = 500;
        static int TimeSinceLastTimeUpdate = TimeUpdateInterval;

        public static void PlayerThreadLoop()
        {
            while (true)
            {
                try
                {
                    while (ActionQueue.TryDequeue(out var action))
                    {
                        action.Invoke();
                    }

                    if (TimeSinceLastTimeUpdate > TimeUpdateInterval)
                    {
                        UpdateTimeForAllPlayers();
                        TimeSinceLastTimeUpdate = 0;
                    }

                    Thread.Sleep(QueueInterval);
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
            Running = new Thread(PlayerThreadLoop)
            {
                IsBackground = false
            };

            Running.Start();
        }
    }
}
