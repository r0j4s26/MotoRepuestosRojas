using System;
using System.Linq;
using System.Runtime.InteropServices;
using System.Security.Claims;
using System.Threading.Tasks;
using FORECAST.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Models;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;
using WMS.Models;
using Microsoft.Extensions.Configuration;

namespace Sicsoft.Checkin.Web
{
    [AllowAnonymous]
    public class LoginModel : PageModel
    {
        private readonly ICrudApi<LoginDevolucion, int> checkInService;


        [BindProperty]
        public LoginViewModel Input { get; set; }

        public LoginModel(ICrudApi<LoginDevolucion, int> checkInService)
        {
            this.checkInService = checkInService;
        }
        public async Task<IActionResult> OnGetAsync()
        {
            try
            {

                return Page();
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return Page();
            }
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                await HttpContext.SignOutAsync();
                return Page();
            }
            ActionResult response = Page();
            try
            {
                var resultado = await checkInService.Login(Input.nombreUsuario, Input.clave);
                string str = "";

                foreach (var item in resultado.Seguridad)
                {
                    str += item.CodModulo + "|";
                }


                var identity = new ClaimsIdentity(CookieAuthenticationDefaults.AuthenticationScheme);
                identity.AddClaim(new Claim(ClaimTypes.Name, resultado.Email));
                identity.AddClaim(new Claim(ClaimTypes.UserData, resultado.token));
                //identity.AddClaim(new Claim(ClaimTypes.Actor, resultado.idLogin.ToString()));
                identity.AddClaim(new Claim(ClaimTypes.Role, resultado.idRol.ToString()));
                identity.AddClaim(new Claim("Roles", str));
                // identity.AddClaim(new Claim("CambiarClave", resultado.CambiarClave.ToString())); 
                identity.AddClaim(new Claim(ClaimTypes.Actor, resultado.id.ToString()));

                var principal = new ClaimsPrincipal(identity);
                await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);



                return Redirect("../Index");


            }
            catch (ValidationApiException)
            {
                // handle validation here by using validationException.Content,
                // which is type of ProblemDetails according to RFC 7807

                // If the response contains additional properties on the problem details,
                // they will be added to the validationException.Content.Extensions collection.
            }
            catch (ApiException exception)
            {

                Errores error = JsonConvert.DeserializeObject<Errores>(exception.Content.ToString());
                ModelState.AddModelError("User name", error.Message);
                return Page();


            }
            catch (Exception ex)
            {
                ModelState.AddModelError("User name", ex.Message);
                return Page();
            }

            return response;


        }
    }
}