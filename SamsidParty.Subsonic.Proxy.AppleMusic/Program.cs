using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Proxy.AppleMusic;
using SamsidParty.Subsonic.Proxy.AppleMusic.Controllers;

Keys.Load();
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddSingleton<AppleMusicRequestImplementation, AppleMusicRequestImplementation>();
builder.Services.AddMvc()
    .ConfigureApplicationPartManager((ApplicationPartManager apm) =>
    {
        // Prevents the base class controller from being mapped
        var commonLib = apm.ApplicationParts.FirstOrDefault(a => a.Name == "SamsidParty.Subsonic.Common");

        if (commonLib != null)
        {
            apm.ApplicationParts.Remove(commonLib);
        }
    })
    .AddNewtonsoftJson();

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseMiddleware<SubsonicMiddleware>();
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

app.Run();
