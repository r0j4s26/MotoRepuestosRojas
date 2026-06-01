using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace FORECAST.Models
{
    public class ParametrosFiltros
    {
        public string Texto { get; set; }
        public int Codigo1 { get; set; }
        public int Codigo2 { get; set; }
        public int Codigo3 { get; set; }
        public int Codigo4 { get; set; }
        public int Codigo5 { get; set; }
        public int Codigo6 { get; set; }

        public DateTime FechaInicio { get; set; }
        public DateTime FechaInicial { get; set; }
        public DateTime FechaFinal { get; set; }
         
        public string Texto2 { get; set; }
        public string Buscar { get; set; }
        public string ItemCode { get; set; }
     
        public bool Activo { get; set; }
        public string ActivarActivo { get; set; }

    }
}
