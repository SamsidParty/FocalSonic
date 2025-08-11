using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Proxy.AppleMusic;
using SamsidParty.Subsonic.Proxy.AppleMusic.Controllers;

AppleMusicKeys.Load();
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSingleton<IController, AppleMusicRequestImplementation>();
builder.Services.AddMvc()
    .AddNewtonsoftJson();

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseMiddleware<SubsonicMiddleware>("applemusic");
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

app.Run();
