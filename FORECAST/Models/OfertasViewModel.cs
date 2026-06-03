using System.Collections.Generic;
using System;

namespace MotoRepuestosRojas.Models
{
    public class OfertasViewModel
    {
        public int id { get; set; }
        public int idCliente { get; set; }
        public int idCondPago { get; set; }
        public DateTime Fecha { get; set; }
        public string Comentarios { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TotalImpuestos { get; set; }
        public decimal TotalDescuentos { get; set; }
        public decimal TotalCompra { get; set; }
        public string Moneda { get; set; }
        public string Status { get; set; }
        public string TipoDocumento { get; set; }
        public decimal Redondeo { get; set; }
        public List<DetOfertaViewModel> Detalle { get; set; }
    }
}
