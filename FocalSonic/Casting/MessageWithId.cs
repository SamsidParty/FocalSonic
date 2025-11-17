using GoogleCast.Messages;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Casting
{
    [DataContract]
    public class MessageWithId : Message, IMessageWithId
    {
        private static int _id = new Random().Next();

        /// <summary>
        /// Gets a value indicating whether the message has a request identifier
        /// </summary>
        public bool HasRequestId
        {
            get { return _requestId != null; }
        }

        private int? _requestId;
        /// <summary>
        /// Gets or sets the request identifier
        /// </summary>
        [DataMember(Name = "requestId")]
        public int RequestId
        {
            get { return (int)(_requestId ?? (_requestId = Interlocked.Increment(ref _id))); }
            set { _requestId = value; }
        }

        [DataMember(Name = "mediaSessionId", EmitDefaultValue = false)]
        public long? MediaSessionId { get; set; }


        public MessageWithId(long mediaSessionID, string type)
        {
            this.MediaSessionId = mediaSessionID;
            this.Type = type;
        }
    }
}
