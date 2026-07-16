using System.ComponentModel.DataAnnotations;

namespace MotoRepuestosRojas.Models
{
    public class CajasViewModel
    {
        public int id { get; set; }


        [StringLength(20)]
        public string Nombre { get; set; }

        public decimal MontoAperturaColones { get; set; }

        public decimal MontoAperturaDolares { get; set; }
    }
}
