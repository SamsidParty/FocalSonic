using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FocalSonic.Helpers
{
    public class FocalSonicContractResolver : DefaultContractResolver
    {
        protected override JsonProperty CreateProperty(System.Reflection.MemberInfo member, MemberSerialization memberSerialization)
        {
            var property = base.CreateProperty(member, memberSerialization);

            // Ignores empty datetime offsets
            // This prevents the "starred" property specifically from being set if the value is DateTimeOffset.MinValue
            if (property.PropertyType == typeof(DateTimeOffset))
            {
                var oldShouldSerialize = property.ShouldSerialize;
                property.ShouldSerialize = obj =>
                {
                    if (oldShouldSerialize != null && !oldShouldSerialize(obj))
                        return false;

                    var value = (DateTimeOffset)property.ValueProvider.GetValue(obj);
                    return value != DateTimeOffset.MinValue;
                };
            }

            return property;
        }
    }
}
