using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;

namespace FORECAST.Pages.Usuarios
{
    public class EditarModel : PageModel
    {
        private readonly ICrudApi<UsuariosViewModel, int> service; //API
        private readonly ICrudApi<RolesViewModel, int> roles;


        [BindProperty]
        public UsuariosViewModel Usuario { get; set; }

        [BindProperty]
        public RolesViewModel[] RolesLista { get; set; }


        public EditarModel(ICrudApi<UsuariosViewModel, int> service, ICrudApi<RolesViewModel, int> roles) //CTOR 
        {
            this.service = service;
            this.roles = roles;


        }
        public async Task<IActionResult> OnGetAsync(int id)
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "5").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }
                Usuario = await service.ObtenerPorId(id);
                RolesLista = await roles.ObtenerLista("");

                Usuario.Clave = "";
                return Page();
            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                return Page();
            }
        }

        public async Task<IActionResult> OnPostAsync()
        {
            try
            {
                if (Usuario == null ||
          Usuario.idRol == 0 ||
          string.IsNullOrWhiteSpace(Usuario.Nombre) ||
          string.IsNullOrWhiteSpace(Usuario.NombreUsuario) ||
          string.IsNullOrWhiteSpace(Usuario.Clave) )
                {
                    RolesLista = await roles.ObtenerLista("");

                    ModelState.AddModelError(string.Empty, "Debe completar todos los datos obligatorios del usuario.");
                    return Page();
                }
                await service.Editar(Usuario);
                return RedirectToPage("./Index");
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return Page();
            }
            catch (Exception ex)
            {

                ModelState.AddModelError(string.Empty, ex.Message);
                return Page();
            }
        }
    }
}
