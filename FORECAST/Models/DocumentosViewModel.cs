using System.Collections.Generic;
using System;

namespace MotoRepuestosRojas.Models
{
    public class DocumentosViewModel
    {
        public int id { get; set; }
        public int idCliente { get; set; }
        public int idCondPago { get; set; }

        public int idCaja { get; set; }
        public int idUsuarioCreador { get; set; }
        public DateTime Fecha { get; set; }
        public string Comentarios { get; set; }
        public decimal Subtotal { get; set; }
        public decimal TotalImpuestos { get; set; }
        public decimal TotalDescuentos { get; set; }
        public decimal TotalCompra { get; set; }
        public string Moneda { get; set; }
        public decimal PorDescto { get; set; }
        public MetodosPagosViewModel[] MetodosPagos { get; set; }
        public DetDocumentoViewModel[] Detalle { get; set; }
        public int BaseEntry { get; set; }
    }
}
