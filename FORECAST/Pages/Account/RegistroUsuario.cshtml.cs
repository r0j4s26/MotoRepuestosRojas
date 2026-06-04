using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;

namespace Sicsoft.CostaRica.Checkin.Web.Pages.Account
{
    public class RegistroUsuarioModel : PageModel
    {
        private readonly ICrudApi<LoginUsuario, int> service;
        private readonly ICrudApi<RolesViewModel, int> roles;

        [BindProperty]
        public LoginUsuario Input { get; set; }

        [BindProperty]
        public RolesViewModel[] Roles { get; set; }



        public RegistroUsuarioModel(ICrudApi<LoginUsuario, int> service, ICrudApi<RolesViewModel, int> roles)
        {
            this.service = service;
            this.roles = roles;

        }
        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles1 = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles1.Where(a => a == "5").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }
                Roles = await roles.ObtenerLista("");



            }
            catch (Exception)
            {


            }
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                if (Input == null ||Input.idRol == 0 ||string.IsNullOrWhiteSpace(Input.Nombre) ||string.IsNullOrWhiteSpace(Input.NombreUsuario) ||string.IsNullOrWhiteSpace(Input.Clave))
                {
                    Roles = await roles.ObtenerLista("");

                    ModelState.AddModelError(string.Empty, "Debe completar todos los datos obligatorios del usuario.");
                    return Page();
                }
                if (string.IsNullOrEmpty(Input.Clave))
                {
                    throw new Exception("La clave debe contener elementos");
                }


                await service.Agregar(Input);
                return RedirectToPage("/Usuarios/Index");
                // return Redirect("../Index");
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
