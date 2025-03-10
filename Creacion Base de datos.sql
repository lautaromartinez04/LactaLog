

create table Usuarios_Rol 
(
ROLID int identity (1,1) not null PRIMARY KEY,
DESCRIPCION varchar(50) not null,
PERMISO varchar(50) not null
)



CREATE TABLE Usuarios 
(
    USUARIOID INT IDENTITY (1,1) NOT NULL PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    EMAIL VARCHAR(50) NOT NULL,
    TELEFONO VARCHAR(50),
    ROLUSUARIO INT NOT NULL,
    HSPASS VARCHAR(MAX) NOT NULL,
	EXTERNO bit not null,
    CONSTRAINT FK_Usuarios_Rol FOREIGN KEY (ROLUSUARIO) REFERENCES Usuarios_Rol(ROLID)
);



create table Clientes
(
CLIENTEID int identity (1,1) NOT NULL PRIMARY KEY,
NOMBRE VARCHAR(50) NOT NULL

)


create table Transporte
(
TRANSPORTEID int identity (1,1) not null PRIMARY KEY,
TRANSPORTEUUID varchar(80) null,
USUARIOID_TRANSPORTE int not null,
CLIENTEID int not null,
FECHAHORATRANSPORTE datetime not null,
LITROS decimal (12,2) not null,
PALCOHOL bit not null,
TEMPERATURA decimal (8,2) not null,
FECHAHORAMODIFICACION datetime null,
USUARIOID_MODIFICACION int null,
VERSION int not null,
CONSTRAINT FK_Usuarios_Transporte FOREIGN KEY (USUARIOID_TRANSPORTE) REFERENCES Usuarios(USUARIOID), 
CONSTRAINT FK_Usuarios_Modif FOREIGN KEY (USUARIOID_MODIFICACION) REFERENCES Usuarios(USUARIOID), 
CONSTRAINT FK_Cliente_ID  FOREIGN KEY (CLIENTEID) REFERENCES Clientes(CLIENTEID) 
)


create table Analisis(
ANALISISID int identity (1,1) not null PRIMARY KEY,
TRANSPORTEID int null,
USUARIOID_ANALISIS int not null,
FECHAHORAANALISIS datetime not null,
MG_PORCENTUAL decimal(5,2) null,
MG_KG decimal(15,2) null,
PROT_PORCENTUAL decimal(5,2) null,
PROT_KG decimal(15,2) null,
LACT_PORCENTUAL decimal(5,2) null,
LACT_KG decimal(15,2) null,
SNG_PORCENTUAL decimal(5,2) null,
SNG_KG decimal(15,2) null,
ST_PORCENTUAL decimal(5,2) null,
ST_KG decimal(15,2) null,
UREA decimal(15,2) null,
FECHAHORAMODIFICACION datetime null,
USUARIOID_MODIFICACION int null,
VERSION int not null,
CONSTRAINT FK_Usuarios_Analisis FOREIGN KEY (USUARIOID_ANALISIS) REFERENCES Usuarios(USUARIOID),
CONSTRAINT FK_Usuarios_ModifAna FOREIGN KEY (USUARIOID_MODIFICACION) REFERENCES Usuarios(USUARIOID),
CONSTRAINT FK_Transporte_ID FOREIGN KEY (TRANSPORTEID) REFERENCES Transporte(TRANSPORTEID)
)


CREATE TABLE Transporte_Auditoria (
    AUDITORIAID INT IDENTITY(1,1) PRIMARY KEY,
    TRANSPORTEID INT NOT NULL,
    USUARIOID_TRANSPORTE INT NOT NULL,
    CLIENTEID INT NULL,
    FECHAHORATRANSPORTE DATETIME NOT NULL,
    LITROS DECIMAL(12,2) NOT NULL,
    PALCOHOL BIT NOT NULL,
    TEMPERATURA DECIMAL(8,2) NOT NULL,
    FECHAHORAMODIFICACION DATETIME NULL,
    USUARIOID_MODIFICACION INT NULL,
    VERSION INT NOT NULL,
    FECHA_AUDITORIA DATETIME DEFAULT GETDATE(),
	USUARIOID_AUDITORIA INT NOT NULL
);


CREATE TABLE Analisis_Auditoria (
    AUDITORIAID INT IDENTITY(1,1) PRIMARY KEY,
    ANALISISID INT NOT NULL,
    TRANSPORTEID INT NOT NULL,
    USUARIOID_ANALISIS INT NOT NULL,
    FECHAHORAANALISIS DATETIME NOT NULL,
    MG_PORCENTUAL DECIMAL(5,2) NULL,
    MG_KG DECIMAL(15,2) NULL,
    PROT_PORCENTUAL DECIMAL(5,2) NULL,
    PROT_KG DECIMAL(15,2) NULL,
    LACT_PORCENTUAL DECIMAL(5,2) NULL,
    LACT_KG DECIMAL(15,2) NULL,
    SNG_PORCENTUAL DECIMAL(5,2) NULL,
    SNG_KG DECIMAL(15,2) NULL,
    ST_PORCENTUAL DECIMAL(5,2) NULL,
    ST_KG DECIMAL(15,2) NULL,
    UREA DECIMAL(15,2) NULL,
    FECHAHORAMODIFICACION DATETIME NULL,
    USUARIOID_MODIFICACION INT NULL,
    VERSION INT NOT NULL,
    FECHA_AUDITORIA DATETIME DEFAULT GETDATE(),
	USUARIOID_AUDITORIA INT NOT NULL

);

insert into Usuarios_Rol (DESCRIPCION,PERMISO) Values ('Administrador','VABM')
insert into Usuarios_Rol (DESCRIPCION,PERMISO) Values ('Cliente','V')
insert into Usuarios_Rol (DESCRIPCION,PERMISO) Values ('Usuario Administrativo','VABM')
insert into Usuarios_Rol (DESCRIPCION,PERMISO) Values ('Camionero','VA')