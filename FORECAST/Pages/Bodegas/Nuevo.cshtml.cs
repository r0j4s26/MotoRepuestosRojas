using FORECAST.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MotoRepuestosRojas.Models;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using System.Security.Claims;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace MotoRepuestosRojas.Pages.Bodegas
{
    public class NuevoModel : PageModel
    {
        private readonly ICrudApi<BodegasViewModel, int> bodegas;


        [BindProperty]
        public BodegasViewModel Bodegas { get; set; }



        public NuevoModel(ICrudApi<BodegasViewModel, int> bodegas)
        {

            this.bodegas = bodegas;

        }
        public async Task<IActionResult> OnGetAsync()
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "1").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }



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
                await bodegas.Agregar(Bodegas);
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
