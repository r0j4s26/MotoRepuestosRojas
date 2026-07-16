
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

namespace MotoRepuestosRojas.Pages.Documentos
{
    public class ObservarModel : PageModel
    {
        private readonly IConfiguration configuration;
        private readonly ICrudApi<DocumentosViewModel, int> service;
        private readonly ICrudApi<ClientesViewModel, string> serviceE;
        private readonly ICrudApi<ProductosViewModel, int> serviceP;
        private readonly ICrudApi<CondicionesPagosViewModel, int> condiciones;
        private readonly ICrudApi<CuentasBancariasViewModel, int> cuentas;


        [BindProperty]
        public ClientesViewModel[] Clientes { get; set; }

        [BindProperty]
        public DocumentosViewModel Documento { get; set; }

        [BindProperty]
        public ProductosViewModel[] Productos { get; set; }

        [BindProperty]
        public CondicionesPagosViewModel[] Condicion { get; set; }


        [BindProperty]
        public CuentasBancariasViewModel[] Cuentas { get; set; }




        public ObservarModel(IConfiguration configuration, ICrudApi<DocumentosViewModel, int> service, ICrudApi<CuentasBancariasViewModel, int> cuentas, ICrudApi<ClientesViewModel, string> serviceE, ICrudApi<ProductosViewModel, int> serviceP, ICrudApi<CondicionesPagosViewModel, int> condiciones)
        {
            this.service = service;
            this.serviceE = serviceE;
            this.serviceP = serviceP;

            this.configuration = configuration;
            this.condiciones = condiciones;
            this.cuentas = cuentas;
        }
        public async Task<IActionResult> OnGetAsync(int id)
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "20").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }

                ParametrosFiltros filtro = new ParametrosFiltros();
                filtro.Activo = true;

                Documento = await service.ObtenerPorId(id);

                Clientes = await serviceE.ObtenerLista("");
                Productos = await serviceP.ObtenerLista("");
                Condicion = await condiciones.ObtenerLista("");
                Cuentas = await cuentas.ObtenerLista("");


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
