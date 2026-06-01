using System.ComponentModel.DataAnnotations;

namespace FORECAST.Models
{
    public class SucursalesViewModel
    {
        public int id { get; set; }

        [StringLength(50)]
        public string Nomenclatura { get; set; }

        public bool Activo { get; set; }

        public string Skey { get; set; }

        public int MesesBloqueo { get; set; }

        public bool AprobacionGerente { get; set; }

    }
}
