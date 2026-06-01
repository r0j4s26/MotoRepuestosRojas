using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FORECAST.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;

namespace FORECAST.Pages.Account
{
    public class CambioContrasenaModel : PageModel
    {
        private readonly ICrudApi<LoginUsuario, int> checkInService;

        [BindProperty]
        public LoginUsuario Input { get; set; }

        public CambioContrasenaModel(ICrudApi<LoginUsuario, int> checkInService)
        {
            this.checkInService = checkInService;
        }
        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                var ced = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == ClaimTypes.NameIdentifier).Select(s1 => s1.Value).FirstOrDefault();
                Input.Email = User.Identity.Name;
                
               Input.id = int.Parse(((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == ClaimTypes.Actor).Select(s1 => s1.Value).FirstOrDefault());
                Input.idRol = 0;
                Input.Nombre = "";
                if(string.IsNullOrEmpty(Input.Clave))
                {
                    throw new Exception("La clave debe contener elementos");
                }
                await checkInService.Editar(Input);
                await HttpContext.SignOutAsync();
                return Redirect("./Index");

                //return Redirect("../Index");
            }
         
            catch (Exception ex)
            {
                
                ModelState.AddModelError(string.Empty, ex.Message);
                //return Redirect("/Error");
                return Page();
            }
        }
    }
}
