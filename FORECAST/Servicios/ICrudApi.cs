using FORECAST.Models;
using Refit;
using Sicsoft.Checkin.Web.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Sicsoft.Checkin.Web.Servicios
{
     

    public interface ICrudApi<TEntity, TKey> where TEntity : class
    {

        [Post("")]
        Task<TEntity[]> AgregarBulk([Body] TEntity[] payload);

        [Post("/Insertar")]
        Task<TEntity> Agregar([Body] TEntity payload);

 
        [Post("/Insertar")]
        Task<TEntity> AgregarAprobacion(int id);

        [Get("/InsertarSAP")]
        Task InsertarSAP();

        [Post("/Actualizar")]
        Task<TEntity> ActualizarPresupuesto(int id);


        [Get("/InsertarLakeHouse")]
        Task InsertarLakeHouse();

        [Multipart]
        [Post("/InsertarExcel")]
        Task InsertarExcel([AliasAs("file")] StreamPart file);

        [Post("")]
        Task<TEntity> CambiarClave([Body] TEntity payload);
        [Get("")]
        Task<TEntity> Login(string nombreUsuario, string clave);

        [Get("/Conectar365")]
		Task<TEntity> Login365(string email);

		[Get("")]
        Task<TEntity[]> ObtenerLista<TQuery>(TQuery q);



        [Get("/Compañias")]
        Task<TEntity[]> ObtenerCompañias(string email);

        [Get("")]
        Task<TEntity> ObtenerListaEspecial<TQuery>(TQuery q);
        [Get("/Consultar")]
        Task<TEntity> ObtenerPorId(int id);

        [Get("/Consultar")]
        Task<TEntity> ObtenerPorIdString(string id);

        [Get("/RecalcularCuota")]
        Task<TEntity> RecalcularCuota(int id);

        [Get("/RecalcularTiempo")]
        Task<TEntity> RecalcularTiempo(int id);

        [Put("/Actualizar")]
        Task Editar( [Body]TEntity payload);

 

        [Delete("/Eliminar")]
        Task Eliminar(int id);

        [Post("/Aprobar")]
        Task Aprobar(int id, string aprobados, string tipo, int idUsuario);

        [Get("/PasarPrestamo")]
        Task PasarPrestamo(int id);


    }
}
