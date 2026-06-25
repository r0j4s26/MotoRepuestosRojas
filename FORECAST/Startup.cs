using System;
using System.Globalization;
using FORECAST.Models;
using FORECAST.Models;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Localization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Planillas.Models;
using FORECAST.Models;
using Refit;
using Sicsoft.Checkin.Web.Models;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;
using WMS.Models;
using System.Threading.Tasks;
using Microsoft.AspNetCore.HttpOverrides;
using MotoRepuestosRojas.Models;

namespace Sicsoft.Checkin.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
           .AddCookie(options =>
           {
               options.ExpireTimeSpan = TimeSpan.FromMinutes(30);
           });

            services.AddHttpContextAccessor();

            services.AddScoped<AuthenticatedHttpClientHandler>();

            services.AddApiServices(Configuration);

            services.AddControllersWithViews()
                .AddRazorRuntimeCompilation();

            services.AddRazorPages()
                .AddMvcOptions(options =>
                {

                    options.Filters.Add(new AuthorizeFilter());
                });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.UseStatusCodePagesWithReExecute("/StatusCode", "?code={0}");

            app.UseHttpsRedirection();

            var supportedCultures = new[]
            {
                new CultureInfo("en-US"), //es-cr

            };

            app.UseRequestLocalization(new RequestLocalizationOptions
            {
                DefaultRequestCulture = new RequestCulture("en-US"),

                // Formatting numbers, dates, etc.
                SupportedCultures = supportedCultures,
                // UI strings that we have localized.
                SupportedUICultures = supportedCultures
            });

            app.UseStaticFiles();

            app.UseRouting();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
            });
        }
    }

    public static class CheckinServiceCollectionExtensions
    {
        public static IServiceCollection AddApiServices(this IServiceCollection services, IConfiguration Configuration)
        {


            services.AddRefitClient<ICrudApi<LoginDevolucion, int>>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Login/Conectar"));
            // Add additional IHttpClientBuilder chained methods as required here:
            //  .AddHttpMessageHandler<AuthenticatedHttpClientHandler>()
            // .SetHandlerLifetime(TimeSpan.FromMinutes(2));





            services.AddRefitClient<ICrudApi<LoginUsuario, int>>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Usuarios"))
            .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<LoginUsuarioViewModel, int>>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Login"))
            .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();


            services.AddRefitClient<ICrudApi<UsuariosViewModel, int>>()
           .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Usuarios"))
           .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<RolesViewModel, int>>()
            .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Roles"))
            .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();


            services.AddRefitClient<ICrudApi<SeguridadModulosViewModel, int>>()
      .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/SeguridadModulos"))
      .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();


            services.AddRefitClient<ICrudApi<SeguridadRolesModulosViewModel, int>>()
      .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/SeguridadRolesModulos"))
      .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();




            services.AddRefitClient<ICrudApi<BitacoraErroresViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Bitacora"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<SucursalesViewModel, int>>()
   .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Sucursales"))
   .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<UsuariosSucursalesViewModel, int>>()
   .ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/UsuariosSucursales"))
   .AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<ParametrosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Parametros"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<ClientesViewModel, string>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Clientes"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<CantonesViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Cantones"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();


            services.AddRefitClient<ICrudApi<BarriosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Barrios"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<DistritosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Distritos"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<CondicionesPagosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/CondicionesPagos"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<ImpuestosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Impuestos"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();


            services.AddRefitClient<ICrudApi<CategoriasViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Categorias"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<BodegasViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Bodegas"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<ProductosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Productos"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<OfertasViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Ofertas"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();

            services.AddRefitClient<ICrudApi<DocumentosViewModel, int>>()
.ConfigureHttpClient(c => c.BaseAddress = new Uri($"{Configuration["UrlWebApi"]}/api/Documentos"))
.AddHttpMessageHandler<AuthenticatedHttpClientHandler>();


            return services;
        }
 
    }
}
