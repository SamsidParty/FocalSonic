using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SamsidParty.Subsonic.Common;
using SamsidParty.Subsonic.Proxy.AppleMusic;
using SamsidParty.Subsonic.Proxy.AppleMusic.Controllers;

public class AppleMusicSubsonicProxy
{
    public static bool IsRunning = false;
    public static bool HasStarted = false;


    public void ConfigureServices(IServiceCollection services)
    {
        services.AddSingleton<IController, AppleMusicRequestImplementation>();
        services.AddControllers()
            .AddNewtonsoftJson()
            .AddApplicationPart(typeof(SubsonicMiddleware).Assembly)
            .AddApplicationPart(typeof(AppleMusicSubsonicProxy).Assembly);
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        HasStarted = true;

        app.UseMiddleware<SubsonicMiddleware>("applemusic", () =>
        {
            var users = new Dictionary<string, string>();

            if (AppleMusicKeys.ProxyUsername != null && AppleMusicKeys.ProxyPassword != null)
            {
                users.Add(AppleMusicKeys.ProxyUsername, AppleMusicKeys.ProxyPassword);
            }

            return users;
        });
        app.UseRouting();
        app.UseAuthorization();
        app.UseEndpoints(endpoints => endpoints.MapControllers());

        IsRunning = true;
    }
}

