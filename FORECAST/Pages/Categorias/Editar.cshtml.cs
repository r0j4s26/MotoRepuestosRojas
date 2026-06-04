using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using FORECAST.Models;
using MotoRepuestosRojas.Models;

namespace FORECAST.Pages.Categorias
{
    public class EditarModel : PageModel
    {
        private readonly ICrudApi<CategoriasViewModel, int> service;

        [BindProperty]
        public CategoriasViewModel Categorias { get; set; }


        public EditarModel(ICrudApi<CategoriasViewModel, int> service)
        {
            this.service = service;


        }
        public async Task<IActionResult> OnGetAsync(int id)
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "13").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }

                Categorias = await service.ObtenerPorId(id);


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
                if (Categorias == null ||
               string.IsNullOrWhiteSpace(Categorias.Nombre))
                {
                    ModelState.AddModelError(string.Empty, "Debe completar todos los datos obligatorios.");
                    return Page();
                }
                await service.Editar(Categorias);
                return RedirectToPage("./Index");
            }
            catch (ApiException ex)
            {
                Errores error = JsonConvert.DeserializeObject<Errores>(ex.Content.ToString());
                ModelState.AddModelError(string.Empty, error.Message);

                return Page();
            }
        }
    }
}