using FORECAST.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MotoRepuestosRojas.Models;
using Newtonsoft.Json;
using Refit;
using Sicsoft.Checkin.Web.Servicios;
using Sicsoft.CostaRica.Checkin.Web.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace MotoRepuestosRojas.Pages.CierreCajas
{
    public class ObservarModel : PageModel
    {
        private readonly ICrudApi<CierreCajasViewModel, int> service;

        private readonly ICrudApi<UsuariosViewModel, int> users;
        private readonly ICrudApi<CajasViewModel, int> cajo;
        private readonly ICrudApi<DocumentosViewModel, int> documento;
        private readonly ICrudApi<MetodosPagosViewModel, int> pagos;
        private readonly ICrudApi<CuentasBancariasViewModel, int> cuenta;
        private readonly ICrudApi<CondicionesPagosViewModel, int> cond;
        private readonly ICrudApi<ClientesViewModel, string> clientes;
        private readonly ICrudApi<ParametrosViewModel, int> param;


        [BindProperty]
        public CierreCajasViewModel Cierres { get; set; }



        [BindProperty]
        public UsuariosViewModel Users { get; set; }

        [BindProperty]
        public CajasViewModel[] Cajos { get; set; }

        [BindProperty]
        public string Caja { get; set; }



        [BindProperty]
        public DocumentosViewModel[] Documento { get; set; }



        [BindProperty]
        public MetodosPagosViewModel[] Pagos { get; set; }


        [BindProperty]
        public CuentasBancariasViewModel[] CuentasBancarias { get; set; }
        [BindProperty]
        public CondicionesPagosViewModel Condicion { get; set; }

        [BindProperty]
        public decimal TotalColones { get; set; }

        [BindProperty]
        public decimal TotalFC { get; set; }

        [BindProperty]
        public decimal Totalizado { get; set; }

        [BindProperty]
        public ClientesViewModel[] Clientes { get; set; }

        [BindProperty]
        public CondicionesPagosViewModel[] CondicionC { get; set; }


        [BindProperty]
        public ParametrosViewModel[] Parametros { get; set; }
        public ObservarModel(ICrudApi<CierreCajasViewModel, int> service, ICrudApi<UsuariosViewModel, int> users, ICrudApi<CajasViewModel, int> cajo, ICrudApi<DocumentosViewModel, int> documento, ICrudApi<MetodosPagosViewModel, int> pagos, ICrudApi<CuentasBancariasViewModel, int> cuenta, ICrudApi<CondicionesPagosViewModel, int> cond, ICrudApi<ClientesViewModel, string> clientes)
        {
            this.service = service;
            this.users = users;
            this.cajo = cajo;
            this.documento = documento;
            this.cond = cond;
            this.pagos = pagos;
            this.cuenta = cuenta;
            this.clientes = clientes;
            this.param = param;
        }
        public async Task<IActionResult> OnGetAsync(int id, string Fecha, int idUsuario)
        {
            try
            {
                var Roles = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Roles").Select(s1 => s1.Value).FirstOrDefault().Split("|");
                if (string.IsNullOrEmpty(Roles.Where(a => a == "27").FirstOrDefault()))
                {
                    return RedirectToPage("/NoPermiso");
                }
                Cajos = await cajo.ObtenerLista("");
                var FechaCierre = Convert.ToDateTime(Fecha);
                Cierres = await service.ObtenerCierre(id, FechaCierre);


             
                Caja = ((ClaimsIdentity)User.Identity).Claims.Where(d => d.Type == "Caja").Select(s1 => s1.Value).FirstOrDefault();

                ParametrosFiltros filtro = new ParametrosFiltros();
                filtro.FechaInicial = DateTime.Now;


                filtro.FechaInicial = Cierres.FechaCaja;
                filtro.FechaFinal = Cierres.FechaCaja;

                filtro.Codigo3 = Cierres.idCaja;

                Documento = await documento.ObtenerLista(filtro); //Documentos de la fecha de la caja y de la caja

       

                filtro.Codigo1 = Cierres.idCaja;
                Pagos = await pagos.ObtenerLista(filtro); //aqui nos traemos los pagos de la caja


                Clientes = await clientes.ObtenerLista("");

                CuentasBancarias = await cuenta.ObtenerLista("");

                var Condiciones = await cond.ObtenerLista("");
                Condicion = Condiciones.Where(a => a.Dias == 0 && a.Nombre == "Contado").FirstOrDefault();

                CondicionC = await cond.ObtenerLista("");


                //TotalColones = Documento.Where(a => a.Moneda == "CRC" && a.idCondPago == Condicion.id && a.TipoDocumento != "03").Sum(a => a.TotalCompra) - Documento.Where(a => a.Moneda == "CRC" && a.idCondPago == Condicion.id && a.TipoDocumento == "03").Sum(a => a.TotalCompra) + Pagos.Where(a => a.Metodo.ToLower().Contains("pago a cuenta") && a.Moneda == "CRC").Sum(a => a.Monto);
                //TotalFC = Documento.Where(a => a.Moneda == "USD" && a.idCondPago == Condicion.id && a.TipoDocumento != "03").Sum(a => a.TotalCompra) - Documento.Where(a => a.Moneda == "USD" && a.idCondPago == Condicion.id && a.TipoDocumento == "03").Sum(a => a.TotalCompra) + Pagos.Where(a => a.Metodo.ToLower().Contains("pago a cuenta") && a.Moneda == "USD").Sum(a => a.Monto);

                var TotalColonesPagos = Pagos.Where(a => a.Moneda == "CRC").Sum(a => a.Monto) == null ? 0 : Pagos.Where(a => a.Moneda == "CRC").Sum(a => a.Monto);
           
                var TotalPagosFC = Pagos.Where(a => a.Moneda == "USD").Sum(a => a.Monto) == null ? 0 : Pagos.Where(a => a.Moneda == "USD").Sum(a => a.Monto);
            
                TotalColones = TotalColonesPagos;
                TotalFC = TotalPagosFC ;


                    Totalizado = TotalColones + TotalFC;
                


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
