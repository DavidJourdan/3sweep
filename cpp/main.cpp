#include <GL/glew.h>
#include <GL/glut.h>
#include <iostream>

using namespace std;

void init (const char * modelFilename) {
    glewExperimental = GL_TRUE;
    glewInit(); // init glew, which takes in charges the modern OpenGL calls (v>1.2, shaders, etc)
    glCullFace(GL_BACK);     // Specifies the faces to cull (here the ones pointing away from the camera)
    glEnable(GL_CULL_FACE); // Enables face culling (based on the orientation defined by the CW/CCW enumeration).
    glDepthFunc(GL_LESS); // Specify the depth test for the z-buffer
    glEnable(GL_DEPTH_TEST); // Enable the z-buffer in the rasterization
    glEnable(GL_TEXTURE_2D);
    glEnableClientState(GL_VERTEX_ARRAY);
    glEnableClientState(GL_NORMAL_ARRAY);
    glEnableClientState(GL_COLOR_ARRAY);
    glEnable (GL_NORMALIZE);
    glLineWidth (2.0); // Set the width of edges in GL_LINE polygon mode
    glClearColor (0.0f, 0.0f, 0.0f, 1.0f); // Background color
    
    
    reshape(DEFAULT_SCREENWIDTH, DEFAULT_SCREENHEIGHT);
    try {
        glProgram = GLProgram::genVFProgram ("Simple GL Program", "shader.vert", "shader.frag"); // Load and compile pair of shaders
        glProgram->use (); // Activate the shader program

    } catch (Exception & e) {
        cerr << e.msg () << endl;
    }
}

void updatePerVertexColorResponse () {
    for (unsigned int i = 0; i < colorResponses.size (); i++)
        colorResponses[i] = Vec3f (1.f, 0.f, 0.f);
}

void renderScene () {
    updatePerVertexColorResponse ();
    glVertexPointer (3, GL_FLOAT, sizeof (Vec3f), (GLvoid*)(&(mesh.positions()[0])));
    glNormalPointer (GL_FLOAT, 3*sizeof (float), (GLvoid*)&(mesh.normals()[0]));
    glColorPointer (3, GL_FLOAT, sizeof (Vec3f), (GLvoid*)(&(colorResponses[0])));
    glDrawElements (GL_TRIANGLES, 3*mesh.triangles().size(), GL_UNSIGNED_INT, (GLvoid*)((&mesh.triangles()[0])));
}

int w1 = 0;
int h1 = 0;
void reshape(int w, int h) {
    w1 = w;
    h1 = h;
    glViewport(0, 0, w, h);
}

void display() {
    glClearColor (1.0,0.0,0.0,1.0);
    glClear (GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    glLoadIdentity();
    glEnable( GL_TEXTURE_2D );

    background();
    gluLookAt (0.0, 0.0, 5.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);

    glutSwapBuffers();
}

void key (unsigned char keyPressed, int x, int y) {
    switch (keyPressed) {
    default:
        cout << keyPressed << endl;
        break;
    }
}

int main (int argc, char ** argv) {
    if (argc > 2) {
        printUsage ();
        exit (1);
    }
    glutInit (&argc, argv);
    glutInitDisplayMode (GLUT_RGBA | GLUT_DEPTH | GLUT_DOUBLE);
    glutInitWindowSize (DEFAULT_SCREENWIDTH, DEFAULT_SCREENHEIGHT);
    window = glutCreateWindow (appTitle.c_str ());
    init (argc == 2 ? argv[1] : DEFAULT_MESH_FILE.c_str() );
    glutIdleFunc (idle);
    glutReshapeFunc(reshape);
    glutDisplayFunc(display);
    glutKeyboardFunc (key);
    glutMotionFunc (motion);
    glutMouseFunc (mouse);
    printUsage();
    glutMainLoop();
    return 0;
}